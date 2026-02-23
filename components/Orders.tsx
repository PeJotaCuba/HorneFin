import React, { useState } from 'react';
import { Icons } from './Icons';
import { Order, Recipe } from '../types';

interface OrdersProps {
  orders: Order[];
  recipes?: Recipe[]; // Added recipes prop
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  onConfirmRecurring?: (order: Order) => void;
  t: any;
}

export const Orders: React.FC<OrdersProps> = ({ orders, recipes = [], onAddOrder, onUpdateOrder, onDeleteOrder, onConfirmRecurring, t }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [product, setProduct] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [specifications, setSpecifications] = useState('');
  const [hasDelivery, setHasDelivery] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);

  // Filter State for Export
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [contactPhoneOptions, setContactPhoneOptions] = useState<string[]>([]);
  const [showPhonePicker, setShowPhonePicker] = useState(false);

  const resetForm = () => {
    setCustomerName('');
    setPhone('');
    setProduct('');
    setRecipeId('');
    setQuantity('');
    setSpecifications('');
    setHasDelivery(false);
    setDeliveryAddress('');
    setDeliveryDate('');
    setDeliveryTime('');
    setIsRecurring(false);
    setRecurringDays([]);
    setEditingId(null);
    setIsAdding(false);
    setContactPhoneOptions([]);
    setShowPhonePicker(false);
  };

  const handleEdit = (order: Order) => {
    setCustomerName(order.customerName);
    setPhone(order.phone || '');
    setProduct(order.product);
    setRecipeId(order.recipeId || '');
    setQuantity(order.quantity);
    setSpecifications(order.specifications || '');
    setHasDelivery(order.hasDelivery);
    setDeliveryAddress(order.deliveryAddress || '');
    
    if (order.isRecurring) {
        setIsRecurring(true);
        setRecurringDays(order.recurringDays || []);
        setDeliveryTime(order.deliveryTime || '');
        setDeliveryDate('');
    } else {
        setIsRecurring(false);
        const date = new Date(order.deliveryDate);
        setDeliveryDate(date.toISOString().slice(0, 10));
        setDeliveryTime(date.toTimeString().slice(0, 5));
    }
    
    setEditingId(order.id);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!customerName || !product || !deliveryTime || (!isRecurring && !deliveryDate)) {
      alert("Por favor completa los campos requeridos");
      return;
    }

    const timestamp = !isRecurring ? new Date(`${deliveryDate}T${deliveryTime}`).getTime() : Date.now();
    const finalQuantity = (quantity === '' || quantity <= 0) ? 1 : quantity;

    const newOrder: Order = {
      id: editingId || Date.now().toString(),
      customerName,
      phone,
      product,
      recipeId,
      quantity: finalQuantity,
      specifications,
      hasDelivery,
      deliveryAddress: hasDelivery ? deliveryAddress : undefined,
      deliveryDate: timestamp,
      deliveryTime,
      isRecurring,
      recurringDays: isRecurring ? recurringDays : undefined,
      status: 'PENDING',
      createdAt: editingId ? (orders.find(o => o.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    if (editingId) {
      onUpdateOrder(newOrder);
    } else {
      onAddOrder(newOrder);
    }
    resetForm();
  };

  const toggleDay = (day: number) => {
      setRecurringDays(prev => 
          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
      );
  };

  const handleRecipeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const rId = e.target.value;
      setRecipeId(rId);
      if (rId) {
          const r = recipes.find(rc => rc.id === rId);
          if (r) setProduct(r.name);
      }
  };

  // Actions
  const handleCall = (phone: string) => window.open(`tel:${phone}`, '_self');
  const handleSMS = (phone: string) => window.open(`sms:${phone}`, '_self');
  const handleWhatsApp = (phone: string) => window.open(`https://wa.me/${phone.replace(/\D/g,'')}`, '_blank');

  const handleContactPick = async () => {
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts.length) {
          const contact = contacts[0];
          if (contact.name && contact.name.length) setCustomerName(contact.name[0]);
          
          if (contact.tel && contact.tel.length > 0) {
              if (contact.tel.length === 1) {
                  setPhone(contact.tel[0]);
              } else {
                  setContactPhoneOptions(contact.tel);
                  setShowPhonePicker(true);
              }
          }
        }
      } catch (ex) {
        console.error(ex);
        alert("Error al acceder a contactos o permiso denegado.");
      }
    } else {
      alert("Tu dispositivo no soporta la selección de contactos.");
    }
  };

  const handleExport = () => {
    if (!startDate || !endDate) {
      alert("Selecciona un rango de fechas");
      return;
    }
    alert("Exportando...");
  };

  const sortedOrders = [...orders].sort((a, b) => {
      return b.createdAt - a.createdAt;
  });

  const weekDays = [
      { id: 1, label: t.monday },
      { id: 2, label: t.tuesday },
      { id: 3, label: t.wednesday },
      { id: 4, label: t.thursday },
      { id: 5, label: t.friday },
      { id: 6, label: t.saturday },
      { id: 0, label: t.sunday },
  ];

  return (
    <div className="pb-8 bg-stone-50 dark:bg-stone-950 min-h-screen transition-colors duration-300">
      {/* Phone Picker Modal */}
      {showPhonePicker && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-xl max-w-sm w-full">
                  <h3 className="font-bold text-lg mb-4 dark:text-white">Selecciona un número</h3>
                  <div className="space-y-2">
                      {contactPhoneOptions.map((p, idx) => (
                          <button 
                            key={idx}
                            onClick={() => {
                                setPhone(p);
                                setShowPhonePicker(false);
                                setContactPhoneOptions([]);
                            }}
                            className="w-full p-3 text-left bg-stone-50 dark:bg-stone-800 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition dark:text-white font-mono"
                          >
                              {p}
                          </button>
                      ))}
                  </div>
                  <button 
                    onClick={() => setShowPhonePicker(false)}
                    className="mt-4 w-full py-3 text-stone-500 font-bold"
                  >
                      Cancelar
                  </button>
              </div>
          </div>
      )}

      <div className="bg-white dark:bg-stone-900 p-4 shadow-sm border-b border-stone-100 dark:border-stone-800 sticky top-0 z-20 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1 rounded-lg"><Icons.Orders size={18} /></span>
            {t.ordersTitle}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-[10px] mt-0.5">{t.ordersSubtitle}</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)} 
          className="bg-blue-600 text-white p-2 rounded-xl shadow-lg hover:bg-blue-700 transition"
        >
          {isAdding ? <Icons.Close size={20} /> : <Icons.Plus size={20} />}
        </button>
      </div>

      <div className="p-4 space-y-6">
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-stone-900 w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10">
            <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center sticky top-0 bg-white dark:bg-stone-900 z-10">
                <h3 className="font-bold text-stone-800 dark:text-white text-sm uppercase tracking-widest">{editingId ? t.updateOrder : t.newOrder}</h3>
                <button onClick={resetForm} className="p-2 text-stone-400 hover:text-stone-600"><Icons.Close size={20} /></button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.customerName}</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.phone}</label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" 
                        className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                      <button 
                        onClick={handleContactPick}
                        className="p-3 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700 transition"
                        title="Buscar contacto"
                        type="button"
                      >
                        {Icons.Users ? <Icons.Users size={20} /> : <span className="text-xs">Contactos</span>}
                      </button>
                    </div>
                  </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.selectProductRecipe}</label>
                <select 
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white mb-2"
                    value={recipeId}
                    onChange={handleRecipeSelect}
                >
                    <option value="">-- Manual --</option>
                    {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input 
                  type="text" 
                  placeholder={t.product}
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.quantity}</label>
                <input 
                  type="number" 
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white placeholder-stone-300 dark:placeholder-stone-600"
                  value={quantity}
                  placeholder="0"
                  min="1"
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                        setQuantity('');
                    } else {
                        const num = parseInt(val);
                        setQuantity(isNaN(num) ? '' : num);
                    }
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.specifications}</label>
                <textarea 
                  className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                  rows={2}
                  value={specifications}
                  onChange={e => setSpecifications(e.target.value)}
                />
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                  <div className="flex items-center gap-3 mb-3">
                    <button 
                        onClick={() => setIsRecurring(!isRecurring)}
                        className={`w-10 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-purple-600' : 'bg-stone-300 dark:bg-stone-600'}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isRecurring ? 'translate-x-4' : ''}`}></div>
                    </button>
                    <span className="text-sm font-bold text-stone-700 dark:text-stone-300">{t.recurringOrder}</span>
                  </div>

                  {isRecurring ? (
                      <div className="space-y-3 animate-in fade-in">
                          <div className="flex justify-between gap-1">
                              {weekDays.map(day => (
                                  <button 
                                    key={day.id}
                                    onClick={() => toggleDay(day.id)}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${recurringDays.includes(day.id) ? 'bg-purple-600 text-white' : 'bg-stone-200 dark:bg-stone-700 text-stone-500'}`}
                                  >
                                      {day.label}
                                  </button>
                              ))}
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">Hora</label>
                            <input 
                                type="time" 
                                className="w-full p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-600 dark:text-white"
                                value={deliveryTime}
                                onChange={e => setDeliveryTime(e.target.value)}
                            />
                          </div>
                      </div>
                  ) : (
                      <div className="flex gap-4 animate-in fade-in">
                        <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">{t.deliveryDate}</label>
                        <input 
                            type="date" 
                            className="w-full p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-600 dark:text-white"
                            value={deliveryDate}
                            onChange={e => setDeliveryDate(e.target.value)}
                        />
                        </div>
                        <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase mb-1 block">Hora</label>
                        <input 
                            type="time" 
                            className="w-full p-2 bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-600 dark:text-white"
                            value={deliveryTime}
                            onChange={e => setDeliveryTime(e.target.value)}
                        />
                        </div>
                    </div>
                  )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700">
                <button 
                  onClick={() => setHasDelivery(!hasDelivery)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${hasDelivery ? 'bg-blue-600' : 'bg-stone-300 dark:bg-stone-600'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${hasDelivery ? 'translate-x-4' : ''}`}></div>
                </button>
                <span className="text-sm font-bold text-stone-700 dark:text-stone-300 flex items-center gap-2">
                  <Icons.Delivery size={16} /> {t.delivery}
                </span>
              </div>

              {hasDelivery && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">{t.deliveryAddress}</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 dark:text-white"
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
                  {editingId ? t.updateOrder : t.addOrder}
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-stone-400 italic">{t.noOrders}</p>
            </div>
          ) : (
            sortedOrders.map(order => (
              <div key={order.id} className="bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 relative group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-white text-lg">{order.customerName}</h4>
                    <p className="text-blue-600 font-medium text-sm">{order.quantity}x {order.product}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t[order.status.toLowerCase()] || order.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-stone-600 dark:text-stone-400 mb-3">
                  <div className="flex items-center gap-2">
                    <Icons.Calendar size={14} />
                    {order.isRecurring ? (
                        <span>
                            <span className="text-purple-600 font-bold">{t.recurringOrder}</span>: {order.recurringDays?.map(d => weekDays.find(wd => wd.id === d)?.label).join(', ')} - {order.deliveryTime}
                        </span>
                    ) : (
                        <span>{new Date(order.deliveryDate).toLocaleDateString()} {order.deliveryTime}</span>
                    )}
                  </div>
                  {order.hasDelivery && (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <Icons.Delivery size={14} />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                  {order.specifications && (
                    <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800 rounded-lg text-xs italic">
                      "{order.specifications}"
                    </div>
                  )}
                </div>

                {/* Recurring Confirmation Button */}
                {order.isRecurring && onConfirmRecurring && (() => {
                    const now = new Date();
                    const currentDay = now.getDay();
                    const [hours, minutes] = (order.deliveryTime || "00:00").split(':').map(Number);
                    const deliveryTimeToday = new Date();
                    deliveryTimeToday.setHours(hours, minutes, 0, 0);

                    const isDayMatch = order.recurringDays?.includes(currentDay);
                    const isTimePassed = now.getTime() >= deliveryTimeToday.getTime();
                    
                    const lastDelivery = order.lastDeliveryDate ? new Date(order.lastDeliveryDate) : null;
                    const isProcessedToday = lastDelivery && 
                                           lastDelivery.getDate() === now.getDate() && 
                                           lastDelivery.getMonth() === now.getMonth() && 
                                           lastDelivery.getFullYear() === now.getFullYear();

                    if (isDayMatch && isTimePassed && !isProcessedToday) {
                        return (
                            <div className="mb-3 animate-pulse">
                                <button 
                                    onClick={() => {
                                        if (confirm(t.confirmDeliveryMsg)) {
                                            onConfirmRecurring(order);
                                        }
                                    }}
                                    className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-200 transition border border-purple-200"
                                >
                                    <Icons.Check size={14} /> {t.confirmDelivery}
                                </button>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Contact Actions */}
                {order.phone && (
                    <div className="flex gap-2 mb-3">
                        <button onClick={() => handleCall(order.phone!)} className="flex-1 py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100"><Icons.Call size={14}/> {t.call}</button>
                        <button onClick={() => handleSMS(order.phone!)} className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100"><Icons.Message size={14}/> {t.sms}</button>
                        <button onClick={() => handleWhatsApp(order.phone!)} className="flex-1 py-2 bg-green-100 text-green-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-200"><Icons.Globe size={14}/> {t.whatsapp}</button>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                  <button onClick={() => handleEdit(order)} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Icons.Edit size={16} />
                  </button>
                  <button onClick={() => { if(confirm(t.confirmDelete)) onDeleteOrder(order.id) }} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Icons.Trash size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
